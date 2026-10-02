# StayWise presentation and demonstration

Use the editable StayWise_Presentation.pptx. Suggested duration: 12–16 minutes including the live demonstration. Assign speakers according to actual contributions and rehearse transitions. All members should understand the whole system.

1. Business problem: a reservation is not guaranteed occupancy. Explain staffing, room and follow-up uncertainty without claiming measured monetary losses.
2. Intended users: reservation staff and managers; the system estimates risk before the final outcome.
3. Historical evidence: 119,390 original bookings; after duplicates, 87,396 remain and about 27.5% canceled. Explain that duplicate removal changes the population.
4. Solution: a simple booking form returns risk and a next action. Describe the complete input-to-result flow in ordinary language.
5. Why this model: Random Forest ranked highest on training validation (0.9125). Keep detailed algorithm explanations for questions.
6. Evidence and uncertainty: 85.1% accuracy; identified 3,258 of 4,805 cancellations, missed 1,547 and incorrectly flagged 1,061 kept bookings. Do not describe probability as guaranteed confidence.
7. Live demonstration: start the app, load the example, assess it, explain the probability and recommendation, download JSON. Change lead time to 61 to show reassessment; do not promise this always raises risk. Clear a required field to demonstrate validation. Enter zero guests to show the backend's field-specific error.
8. Business action: respectful confirmations, monitor changing reservations and contingency planning. A prediction does not justify rejecting a guest.
9. Limits and next steps: old data, new hotels, unknown identifiers, uncalibrated scores, temporal validation and a monitored pilot.
10. Team ownership and questions: each member describes actual work and one decision with evidence. Confirm contribution details before finalizing slides.

## Demonstration setup

Run `.\.venv\Scripts\python.exe app.py`, open http://127.0.0.1:5000, and keep the terminal running. Run automated tests before the presentation. Prepare the screenshots in doc/screenshots as a fallback if the live machine is unavailable. Fonts have local fallbacks when the internet is unavailable; prediction runs locally.

## Likely stakeholder questions

- Can we trust every prediction? No: it is an estimate with measured mistakes on historical data. Staff should use it as one input to a decision.
- Does it prove the hotel will save money? No business trial has measured savings; a monitored pilot is needed.
- Why are some fields complicated? The current model expects the original dataset categories and identifiers. A future integration can populate these from reservation records.
- What happens when input is missing? The service returns clear errors for required fields; a small set of optional fields use documented training defaults.
- Will it work for our hotel today? That requires local and recent validation. The training data cover two historical hotels.
- Does a high score explain the cause? No. The application provides workflow recommendations, not causal attribution for individual bookings.
