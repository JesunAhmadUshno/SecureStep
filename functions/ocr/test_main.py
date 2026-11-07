"""Smoke tests for the OCR handler. Run: python3 -m unittest discover -s functions/ocr"""
import json
import unittest

import main


class HandlerTest(unittest.TestCase):
    def test_empty_body_is_rejected(self):
        res = main.handler({}, None)
        self.assertEqual(res['statusCode'], 400)
        self.assertEqual(json.loads(res['body']), {'error': 'No image provided'})

    def test_image_body_returns_tenant_fields(self):
        res = main.handler({'body': 'not-a-real-image'}, None)
        self.assertEqual(res['statusCode'], 200)
        self.assertEqual(set(json.loads(res['body'])), {'Name', 'DOB', 'Address'})

    def test_falls_back_to_mock_without_sdk(self):
        # catalyst_zoho_ocr is not installed here, so the mock must be in use.
        self.assertIs(main.perform_ocr, main.mock_perform_ocr)


if __name__ == '__main__':
    unittest.main()
