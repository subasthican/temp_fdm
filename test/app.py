"""Hotel cancellation decision-support service. Run: python app.py."""
from pathlib import Path
import calendar
import logging
import math
from datetime import date

import joblib
import pandas as pd
from flask import Flask, jsonify, render_template, request

ROOT = Path(__file__).resolve().parent
artifact = joblib.load(ROOT / 'Model' / 'best_hotel_cancellation_model.joblib')
model = artifact['model']
app = Flask(__name__)
app.config['MAX_CONTENT_LENGTH'] = 32 * 1024

# Categories come from the fitted encoder, rather than a second training run.
preprocessor = model.named_steps['classifier'].named_steps['preprocess']
categorical_columns = list(preprocessor.transformers_[1][2])
encoder = preprocessor.named_transformers_['categorical'].named_steps['onehot']
categories = {key: [str(v) for v in values] for key, values in zip(categorical_columns, encoder.categories_)}

GROUPS = [
    ('Booking & arrival', ['hotel', 'arrival_date', 'lead_time', 'stays_in_week_nights', 'stays_in_weekend_nights']),
    ('Guests & preferences', ['adults', 'children', 'babies', 'country', 'meal', 'required_car_parking_spaces', 'total_of_special_requests']),
    ('Booking arrangements', ['market_segment', 'distribution_channel', 'customer_type', 'deposit_type', 'reserved_room_type', 'assigned_room_type', 'adr']),
    ('History & additional details', ['is_repeated_guest', 'previous_cancellations', 'previous_bookings_not_canceled', 'booking_changes', 'days_in_waiting_list', 'agent', 'company']),
]
LABELS = {
    'hotel': 'Hotel type', 'arrival_date': 'Arrival date', 'lead_time': 'Days between booking and arrival',
    'stays_in_week_nights': 'Week nights (Mon–Fri)', 'stays_in_weekend_nights': 'Weekend nights (Sat–Sun)',
    'adults': 'Adults', 'children': 'Children', 'babies': 'Babies', 'country': 'Guest country code', 'meal': 'Meal plan',
    'required_car_parking_spaces': 'Parking spaces requested', 'total_of_special_requests': 'Special requests count',
    'market_segment': 'Market segment', 'distribution_channel': 'Booking channel', 'customer_type': 'Customer type',
    'deposit_type': 'Deposit type', 'reserved_room_type': 'Reserved room code', 'assigned_room_type': 'Assigned room code',
    'adr': 'Average daily rate (dataset currency)', 'is_repeated_guest': 'Returning guest',
    'previous_cancellations': 'Previous cancellations', 'previous_bookings_not_canceled': 'Previous completed bookings',
    'booking_changes': 'Booking changes', 'days_in_waiting_list': 'Waiting list days', 'agent': 'Travel agent ID', 'company': 'Company ID',
}
DEFAULTS = {'hotel': 'City Hotel', 'arrival_date': '2026-10-06', 'lead_time': 30, 'stays_in_week_nights': 3,
    'stays_in_weekend_nights': 1, 'adults': 2, 'children': 0, 'babies': 0, 'country': 'PRT', 'meal': 'BB',
    'required_car_parking_spaces': 0, 'total_of_special_requests': 1, 'market_segment': 'Online TA',
    'distribution_channel': 'TA/TO', 'customer_type': 'Transient', 'deposit_type': 'No Deposit',
    'reserved_room_type': 'A', 'assigned_room_type': 'A', 'adr': 100, 'is_repeated_guest': 0,
    'previous_cancellations': 0, 'previous_bookings_not_canceled': 0, 'booking_changes': 0,
    'days_in_waiting_list': 0, 'agent': 9, 'company': 0}
LIMITS = {'lead_time': 3650, 'stays_in_week_nights': 365, 'stays_in_weekend_nights': 365,
    'adults': 100, 'children': 100, 'babies': 100, 'required_car_parking_spaces': 100,
    'total_of_special_requests': 100, 'adr': 100000, 'is_repeated_guest': 1,
    'previous_cancellations': 10000, 'previous_bookings_not_canceled': 10000,
    'booking_changes': 10000, 'days_in_waiting_list': 3650, 'agent': 1000000, 'company': 1000000}
OPTIONAL = {'agent': 0, 'company': 0, 'children': 0, 'country': 'Unknown'}


def prepare_booking(payload):
    errors, values = {}, {}
    if not isinstance(payload, dict):
        return None, {'form': 'Send a JSON object containing booking details.'}
    for key in DEFAULTS:
        value = payload.get(key)
        if value is None or value == '':
            if key in OPTIONAL:
                value = OPTIONAL[key]
            else:
                errors[key] = 'This field is required.'
                continue
        if key == 'arrival_date':
            try:
                arrival = date.fromisoformat(str(value))
                if not 1900 <= arrival.year <= 2100:
                    raise ValueError()
                values.update(arrival_date_year=arrival.year, arrival_date_month=calendar.month_name[arrival.month],
                    arrival_date_week_number=arrival.isocalendar().week, arrival_date_day_of_month=arrival.day)
            except (TypeError, ValueError):
                errors[key] = 'Enter a valid date between 1900 and 2100 (YYYY-MM-DD).'
        elif key in LIMITS:
            try:
                if isinstance(value, bool):
                    raise ValueError()
                number = float(value)
                if not math.isfinite(number) or not 0 <= number <= LIMITS[key] or (key != 'adr' and not number.is_integer()):
                    raise ValueError()
                values[key] = number if key == 'adr' else int(number)
            except (ValueError, TypeError, OverflowError):
                errors[key] = f'Enter a {"number" if key == "adr" else "whole number"} between 0 and {LIMITS[key]}.'
        else:
            if not isinstance(value, str) or value not in categories.get(key, []):
                errors[key] = 'Choose one of the available options.'
            else:
                values[key] = value
    if not errors:
        if values['adults'] + values['children'] + values['babies'] == 0:
            errors['adults'] = 'Enter at least one guest.'
        nights = values['stays_in_week_nights'] + values['stays_in_weekend_nights']
        if nights == 0:
            errors['stays_in_week_nights'] = 'Enter at least one night for a reservation.'
        values.update(total_nights=nights, is_long_stay=int(nights > 7),
            is_weekend_stay=int(values['stays_in_weekend_nights'] > 0), is_high_lead_time=int(values['lead_time'] > 60))
    return (pd.DataFrame([values], columns=artifact['feature_columns']) if not errors else None), errors


@app.get('/')
def index():
    return render_template('index.html', groups=GROUPS, labels=LABELS, defaults=DEFAULTS,
        categories=categories, limits=LIMITS, optional=OPTIONAL, metrics=artifact['test_metrics'])


@app.get('/api/health')
def health():
    return jsonify(status='ready', model=artifact['selected_model'])


@app.get('/api/model')
def model_info():
    return jsonify(model=artifact['selected_model'], metrics=artifact['test_metrics'],
        threshold=artifact['classification_threshold'], training_cv_roc_auc=artifact['training_cv_roc_auc'],
        categories=categories, example=DEFAULTS, groups=GROUPS, labels=LABELS,
        limits=LIMITS, optional=OPTIONAL)


@app.post('/api/predict')
def predict():
    if not request.is_json:
        return jsonify(error='Use application/json for booking inputs.'), 415
    frame, errors = prepare_booking(request.get_json(silent=True))
    if errors:
        return jsonify(error='Please check the highlighted booking details.', fields=errors), 400
    try:
        probability = float(model.predict_proba(frame)[0, list(model.classes_).index(1)])
        threshold = float(artifact['classification_threshold'])
        canceled = probability >= threshold
        band = 'High' if canceled else 'Moderate' if probability >= .25 else 'Low'
        recommendation = ('Prioritize a friendly confirmation and review cancellation terms. Keep a contingency plan for occupancy.' if canceled
            else 'Consider a confirmation reminder and monitor booking changes.' if band == 'Moderate'
            else 'Continue routine reservation follow-up and occupancy planning.')
        return jsonify(prediction=int(canceled), outcome='Likely to cancel' if canceled else 'Likely to keep booking',
            cancellation_probability=probability, retention_probability=1-probability, risk_band=band,
            threshold=threshold, recommendation=recommendation, model=artifact['selected_model'],
            total_nights=int(frame['total_nights'].iloc[0]),
            note='An estimated risk, not a guarantee. Risk bands are operational guidance; probabilities have not been calibrated. Training bookings date from 2015–2017.')
    except Exception:
        logging.exception('Prediction failed')
        return jsonify(error='Prediction is temporarily unavailable. Please try again.'), 503


@app.errorhandler(413)
def too_large(_error):
    return jsonify(error='Booking input is too large.'), 413


if __name__ == '__main__':
    app.run(host='127.0.0.1', port=5000, debug=False)
