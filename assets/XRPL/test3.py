
import xrpl
from xrpl.clients import JsonRpcClient

JSON_RPC_URL = "https://s2.ripple.com:51234/"
client = JsonRpcClient(JSON_RPC_URL)

max_ledger = '66979633'
tx_id = '46401CF34738E3F328F8F54C4B550514ACA9CFA1F32F587FF580AE88F80D53A9'

from time import sleep
while True:
    sleep(5)
    validated_ledger = xrpl.ledger.get_latest_validated_ledger_sequence(client)
    tx_response = xrpl.transaction.get_transaction_from_hash(tx_id, client)
    if tx_response.is_successful():
        if tx_response.result.get("validated"):
            print("Got validated result!")
            break
        else:
            print(f"Results not yet validated... "
                  f"({validated_ledger}/{max_ledger})")
    if validated_ledger > max_ledger:
        print("max_ledger has passed. Last tx response:", tx_response)

import json
print(json.dumps(tx_response.result, indent=4, sort_keys=True))
print(f"Explorer link: https://testnet.xrpl.org/transactions/{tx_id}")
metadata = tx_response.result.get("meta", {})
if metadata.get("TransactionResult"):
    print("Result code:", metadata["TransactionResult"])
if metadata.get("delivered_amount"):
    print("XRP delivered:", xrpl.utils.drops_to_xrp(
                metadata["delivered_amount"]))

