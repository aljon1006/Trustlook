import requests

url = "https://xumm.app/api/v1/platform/payload"

payload = {
    "txblob": "Optional HEX transaction template",
    "options": {
        "submit": "true",
        "multisign": "false",
        "expire": "1440"
    }
}
headers = {
    "Accept": "application/json",
    "Content-Type": "application/json",
    "X-API-Key": "5d8e6ad4-1722-443a-9adc-b353fc6aab27",
    "X-API-Secret": "31a235b0-5d82-41ab-a26d-35631119d4d4"
}

response = requests.request("POST", url, json=payload, headers=headers)
print(response)
print(response.text)