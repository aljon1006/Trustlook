import xrpl
from xrpl.clients import JsonRpcClient
import xrpl.models.amounts.issued_currency_amount as issued
import xrpl.transaction as trxn
JSON_RPC_URL = "https://s2.ripple.com:51234/"
client = JsonRpcClient(JSON_RPC_URL)



# Look up info about your account
# main_account = 'rLa3U6fdJm2B9cefKV6YUewwDQrLsUcT1L'
main_account = 'rGfz8KHtNVTEpYN1jnPCmfGhe4k8zmR4ew'
sub_account = 'rwiwiJPGK3ZvB7KdJ2PJxAb2Bz3YDKaxfE'
seed = 'sp1fdwRGtYCecgFU1yfVq9fWSgGq8'

import xrpl.wallet as wallet
sequence = xrpl.account.get_next_valid_seq_number(main_account,client)
wallet_ob = wallet.Wallet(seed=seed,sequence=sequence)
public_key = wallet_ob.public_key

amount = issued.IssuedCurrencyAmount(currency='ADV',issuer='rPneN8WPHZJaMT9pF4Ynyyq4pZZZSeTuHu',value='20')
account_info = xrpl.account.get_account_info(main_account,client)
result  = account_info.to_dict()
response_trxn_id = xrpl.account.get_latest_transaction(main_account, client)
trxn_id_dict = response_trxn_id.to_dict()
trxn_id = trxn_id_dict['result']['transactions'][0]['meta']['AffectedNodes'][0]['ModifiedNode']['LedgerIndex']


last_ledger_sequence = result['result']['account_data']['PreviousTxnLgrSeq']
sequence = result['result']['account_data']['Sequence']
# xrpl.models.transactions.transaction.Transaction()
transaction = xrpl.models.transactions.Payment(
    account=main_account,
    amount=amount,
    destination=sub_account,
    last_ledger_sequence=last_ledger_sequence,
    sequence=sequence,
    signing_pub_key=public_key,
    account_txn_id=trxn_id
)
print(transaction)

