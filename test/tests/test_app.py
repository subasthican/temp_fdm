"""Service contract, failure handling, and training-preprocessing parity tests."""
import calendar
from datetime import date
import unittest
from unittest.mock import patch

import numpy as np
import pandas as pd

from app import app, artifact, DEFAULTS, model, prepare_booking, ROOT


class BookingServiceTests(unittest.TestCase):
    def setUp(self):
        self.client = app.test_client()

    def test_page_and_service(self):
        page = self.client.get('/')
        self.assertEqual(page.status_code, 200)
        self.assertIn(b'Booking details', page.data)
        self.assertEqual(self.client.get('/api/health').json['status'], 'ready')
        self.assertEqual(self.client.get('/api/model').json['model'], 'Tuned Random Forest')

    def test_prediction_contract(self):
        response = self.client.post('/api/predict', json=DEFAULTS)
        self.assertEqual(response.status_code, 200)
        result = response.json
        self.assertTrue(0 <= result['cancellation_probability'] <= 1)
        self.assertAlmostEqual(result['cancellation_probability'] + result['retention_probability'], 1)
        self.assertEqual(result['prediction'], int(result['cancellation_probability'] >= .5))
        self.assertEqual(result['total_nights'], 4)

    def test_invalid_and_missing_inputs(self):
        for key, value in [('adults', -1), ('adults', 1.5), ('adr', 'NaN'), ('adr', 'inf'),
                           ('arrival_date', '2026-02-30'), ('hotel', 'Imaginary Hotel'),
                           ('lead_time', True), ('lead_time', None), ('agent', 'not-an-id')]:
            with self.subTest(key=key, value=value):
                response = self.client.post('/api/predict', json={**DEFAULTS, key: value})
                self.assertEqual(response.status_code, 400)
                self.assertIn(key, response.json['fields'])
        self.assertEqual(self.client.post('/api/predict', json={}).status_code, 400)
        self.assertEqual(self.client.post('/api/predict', json=[]).status_code, 400)
        self.assertEqual(self.client.post('/api/predict', data='{', content_type='application/json').status_code, 400)
        self.assertEqual(self.client.post('/api/predict', data='booking').status_code, 415)
        self.assertEqual(self.client.post('/api/predict', data='x' * 40000, content_type='application/json').status_code, 413)

    def test_optional_missing_values_and_cross_field_rules(self):
        booking = {k: v for k, v in DEFAULTS.items() if k not in ['children', 'country', 'agent', 'company']}
        frame, errors = prepare_booking(booking)
        self.assertFalse(errors)
        self.assertEqual(frame.loc[0, 'country'], 'Unknown')
        self.assertEqual(frame.loc[0, 'company'], 0)
        for changes, key in [({'adults': 0, 'children': 0, 'babies': 0}, 'adults'),
                             ({'stays_in_week_nights': 0, 'stays_in_weekend_nights': 0}, 'stays_in_week_nights')]:
            self.assertIn(key, self.client.post('/api/predict', json={**DEFAULTS, **changes}).json['fields'])

    def test_feature_boundaries(self):
        for lead, nights, expected in [(60, 7, (0, 0)), (61, 8, (1, 1))]:
            frame, errors = prepare_booking({**DEFAULTS, 'lead_time': lead, 'stays_in_week_nights': nights, 'stays_in_weekend_nights': 0})
            self.assertFalse(errors)
            self.assertEqual(tuple(frame.loc[0, ['is_high_lead_time', 'is_long_stay']]), expected)

    def test_real_booking_preprocessing_and_prediction_parity(self):
        rows = pd.read_csv(ROOT / 'hotel_bookings.csv', nrows=400)
        checked = 0
        for _, row in rows.iterrows():
            if row['stays_in_week_nights'] + row['stays_in_weekend_nights'] == 0:
                continue
            arrival = date(int(row.arrival_date_year), list(calendar.month_name).index(row.arrival_date_month), int(row.arrival_date_day_of_month))
            if arrival.isocalendar().week != row.arrival_date_week_number:
                continue
            booking = {key: row[key] for key in DEFAULTS if key != 'arrival_date'}
            booking['arrival_date'] = arrival.isoformat()
            for key in ['agent', 'company', 'children']:
                booking[key] = 0 if pd.isna(booking[key]) else int(booking[key])
            booking['country'] = 'Unknown' if pd.isna(booking['country']) else booking['country']
            actual, errors = prepare_booking(booking)
            self.assertFalse(errors)
            expected = row.to_dict()
            expected.update({key: booking[key] for key in ['agent', 'company', 'children', 'country']})
            expected['total_nights'] = row.stays_in_week_nights + row.stays_in_weekend_nights
            expected['is_long_stay'] = int(expected['total_nights'] > 7)
            expected['is_weekend_stay'] = int(row.stays_in_weekend_nights > 0)
            expected['is_high_lead_time'] = int(row.lead_time > 60)
            reference = pd.DataFrame([expected], columns=artifact['feature_columns'])
            np.testing.assert_allclose(model.predict_proba(actual), model.predict_proba(reference), rtol=0, atol=1e-12)
            checked += 1
            if checked == 20:
                break
        self.assertEqual(checked, 20)

    def test_prediction_failure_is_clear(self):
        with patch.object(model, 'predict_proba', side_effect=RuntimeError('internal detail')), self.assertLogs(level='ERROR'):
            response = self.client.post('/api/predict', json=DEFAULTS)
        self.assertEqual(response.status_code, 503)
        self.assertNotIn('internal detail', response.json['error'])


if __name__ == '__main__':
    unittest.main()
