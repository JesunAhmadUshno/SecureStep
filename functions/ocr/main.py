import json
from catalyst_zoho_ocr import perform_ocr  # Placeholder for Zoho Zia OCR SDK

def handler(event, context):
    # Assume event['body'] contains the image file (base64 or binary)
    image_data = event.get('body')
    if not image_data:
        return {
            'statusCode': 400,
            'body': json.dumps({'error': 'No image provided'})
        }
    # Call Zoho Zia OCR (mocked for now)
    ocr_result = perform_ocr(image_data)
    # Example output: {'Name': 'John Doe', 'DOB': '1990-01-01', 'Address': '123 Main St'}
    return {
        'statusCode': 200,
        'body': json.dumps(ocr_result)
    }

# Mock implementation for local dev
# Replace with actual Zoho Zia OCR integration

def perform_ocr(image_data):
    # TODO: Integrate with Zoho Zia OCR API
    return {
        'Name': 'Sample Name',
        'DOB': '1990-01-01',
        'Address': '123 Example St, City, Country'
    }
