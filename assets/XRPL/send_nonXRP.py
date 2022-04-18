import xrpl
from xrpl.clients import JsonRpcClient
import xrpl.wallet as wallet
import pandas as pd
import xrpl.models.amounts.issued_currency_amount as issued
import requests
import json

JSON_RPC_URL = "https://s2.ripple.com:51234/"
client = JsonRpcClient(JSON_RPC_URL)

# get senders and destination
file_senders = 'send_nonXRP_toMAIN.xlsx'
# destination_account = 'rLa3U6fdJm2B9cefKV6YUewwDQrLsUcT1L'
destination_account = input('Destination account (main): ')

# set currency to send
CURRENCY_CODE = input('Currency code (refer to excel list): ')
# AMOUNT_TO_SEND = input('Amount to send: ')
file_currencies = 'issuedcurrencies.xlsx'

df_curr = pd.read_excel(file_currencies, sheet_name='Sheet1')

for index, row in df_curr.iterrows():
    if row['Currency'] == CURRENCY_CODE:
        currency_add = row['Address']
        currency = row['Code']
        print()


df = pd.read_excel(file_senders)
df['Result'] = df['Result'].astype(str)

headers = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 6.1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/41.0.2228.0 Safari/537.36',
}

for index, row in df.iterrows():
    sender_account = row['Address']
    print(sender_account)
    seed = row['Seed']
    sequence = xrpl.account.get_next_valid_seq_number(sender_account,client)
    test_wallet = wallet.Wallet(seed=seed,sequence=sequence)

    # initialize balance
    currency_balance = '0'

    # get account balance
    get_balance_url = f'http://data.ripple.com/v2/accounts/{sender_account}/balances'
    session = requests.Session()
    session.trust_env = False
    response = session.get(get_balance_url, headers=headers)
    data = json.loads(response.text)
    if data.get("balances"):
        balances = data[ 'balances' ]
        for balance in balances:
            if balance[ 'currency' ] == currency:
                currency_balance = balance[ 'value' ]
                print(f'Amount to send: {currency_balance}')

        amount = issued.IssuedCurrencyAmount(currency=currency, issuer=currency_add, value=currency_balance)

        my_payment = xrpl.models.transactions.Payment(
            account=test_wallet.classic_address,
            amount=amount,
            destination=destination_account,
        )
        print("Payment object:", my_payment)

        signed_tx = xrpl.transaction.safe_sign_and_autofill_transaction(
            my_payment, test_wallet, client)
        max_ledger = signed_tx.last_ledger_sequence
        # print(f'max leger: {max_ledger}')
        tx_id = signed_tx.get_hash()
        # print("Signed transaction:", signed_tx)
        print("Transaction cost:", xrpl.utils.drops_to_xrp(signed_tx.fee), "XRP")
        # print("Transaction expires after ledger:", max_ledger)
        print("Identifying hash:", tx_id)

        validated_index = xrpl.ledger.get_latest_validated_ledger_sequence(client)
        min_ledger = validated_index + 1
        # print(f"Can be validated in ledger range: {min_ledger} - {max_ledger}")

        # Tip: you can use xrpl.transaction.send_reliable_submission(signed_tx, client)
        #  to send the transaction and wait for the results to be validated.
        try:
            prelim_result = xrpl.transaction.submit_transaction(signed_tx, client)
        except xrpl.clients.XRPLRequestFailureException as e:
            df.at[ index, 'Result' ] = e
            exit(f"Submit failed: {e}")
        print("Preliminary transaction result:", prelim_result)

        try:
            from time import sleep

            while True:
                # sleep(3)
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

            # print(json.dumps(tx_response.result, indent=4, sort_keys=True))
            print(f"Explorer link: https://testnet.xrpl.org/transactions/{tx_id}")
            metadata = tx_response.result.get("meta", {})
            if metadata.get("TransactionResult"):
                print("Result code:", metadata[ "TransactionResult" ])
                df.at[ index, 'Result' ] = metadata[ "TransactionResult" ]
            else:
                df.at[ index, 'Result' ] = f'TransactionReult not found. Hash: {tx_id}'
        except Exception as ex:
            df.at[ index, 'Result' ] = ex

        print()

    else:
        print('Account Balances not found')
        df.at[ index, 'Result' ] = 'Account balance not found'


print(df)
df.to_excel(file_senders, index = 0)

