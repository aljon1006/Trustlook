# from xrpl.clients import JsonRpcClient
# JSON_RPC_URL = "https://s.altnet.rippletest.net:51234/"
# client = JsonRpcClient(JSON_RPC_URL)

import xrpl
from xrpl.clients import JsonRpcClient
JSON_RPC_URL = "https://s2.ripple.com:51234/"
client = JsonRpcClient(JSON_RPC_URL)


# Look up info about your account
test_account = "rB67WCo91hbzz8hkc3oDgnjDckSvekeZq8"
from xrpl.models.requests.account_info import AccountInfo
acct_info = AccountInfo(
    account=test_account,
    ledger_index="validated",
    strict=True,
)
response = client.request(acct_info)
result = response.result
print("response.status: ", response.status)
import json
print(json.dumps(response.result, indent=4, sort_keys=True))

#get address in another format
from xrpl.core import addresscodec
test_xaddress = addresscodec.classic_address_to_xaddress(test_account, tag=12345, is_test_network=True)
print("\nClassic address:\n\n", test_account)
print("X-address:\n\n", test_xaddress)

#check if account exists
isExisting = xrpl.account.does_account_exist(test_account, client)
print(isExisting)

#get payment transactions
paymentrxn = xrpl.account.get_account_payment_transactions(test_account, client)
print(paymentrxn)

#get latest transaction
response = xrpl.account.get_latest_transaction(test_account, client)
result = response.result
print("response.status: ", response.status)
print(json.dumps(response.result, indent=4, sort_keys=True))


