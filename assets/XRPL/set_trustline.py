import xrpl
from xrpl.clients import JsonRpcClient
import xrpl.models.amounts.issued_currency_amount as issued
import xrpl.wallet as wallet
import pandas as pd
import time

JSON_RPC_URL = "https://s2.ripple.com:51234/"
client = JsonRpcClient(JSON_RPC_URL)

CURRENCY_CODE = input('Enter currency code (refer to excel): ').strip()
filename = 'set_trust_idle.xlsx'
file_currencies = "D:\Programming\XRPL\issuedcurrencies.xlsx"

df_curr = pd.read_excel(file_currencies, sheet_name='Sheet1')

for index, row in df_curr.iterrows():
    if row['Currency'] == CURRENCY_CODE:
        currency_add = str(row['Address'])
        currency = str(row['Code'])
        currency_limit = str(int(row['Limit']))
        print('SETTING TRUSTLINE FOR BELOW ISSUER:')
        print(currency, currency_add, currency_limit)

df = pd.read_excel(filename)
df['Result'] = df['Result'].astype(str)

for index, row in df.iterrows():

    print('Setting trustline for: ' + row['Address'])
    account_add = row['Address']
    seed = row['Seed']
    sequence = xrpl.account.get_next_valid_seq_number(account_add,client)
    test_wallet = wallet.Wallet(seed=seed,sequence=sequence)
    trust_line = issued.IssuedCurrencyAmount(currency=currency,issuer=currency_add,value=currency_limit)
    flags = xrpl.models.transactions.TrustSetFlag.TF_SET_NO_RIPPLE

    trust_set = xrpl.models.transactions.TrustSet(
        account=test_wallet.classic_address,
        limit_amount=trust_line,
        flags=flags
    )

    # time.sleep(1)
    # print("TrustSet object:", trust_set)

    try:
        signed_tx = xrpl.transaction.safe_sign_and_autofill_transaction(
            trust_set, test_wallet, client)
        max_ledger = signed_tx.last_ledger_sequence
        tx_id = signed_tx.get_hash()
        # print("Signed transaction:", signed_tx)
        print("Transaction cost:", xrpl.utils.drops_to_xrp(signed_tx.fee), "XRP")
        # print("Transaction expires after ledger:", max_ledger)
        print("Identifying hash:", tx_id)

        # time.sleep(1)
        # ERROR HERE
        validated_index = xrpl.ledger.get_latest_validated_ledger_sequence(client)
        min_ledger = validated_index + 1
        # print(f"Can be validated in ledger range: {min_ledger} - {max_ledger}")

        # Tip: you can use xrpl.transaction.send_reliable_submission(signed_tx, client)
        #  to send the transaction and wait for the results to be validated.
        # ERROR HERE
        prelim_result = xrpl.transaction.submit_transaction(signed_tx, client)

    except xrpl.clients.XRPLRequestFailureException as e:
        df.at[index, 'Result'] = e
        exit(f"Submit failed: {e}")
    print("Preliminary transaction result:", prelim_result)

    try:
        # time.sleep(2)
        from time import sleep
        while True:
            sleep(1)
            validated_ledger = xrpl.ledger.get_latest_validated_ledger_sequence(client)
            tx_response = xrpl.transaction.get_transaction_from_hash(tx_id, client)
            if tx_response.is_successful():
                if tx_response.result.get("validated"):
                    # print("Got validated result!")
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
        # print(metadata)
        if metadata.get("TransactionResult"):
            print("Result code:", metadata["TransactionResult"])
            df.at[index,'Result'] = metadata["TransactionResult"]
        else:
            df.at[index,'Result'] = f'TransactionReult not found. Hash: {tx_id}'
    except Exception as ex:
        df.at[index, 'Result'] = ex
    print()
    time.sleep(1)

print(df)
df.to_excel(filename, index = 0)
