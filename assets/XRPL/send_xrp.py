import xrpl
from xrpl.clients import JsonRpcClient
import xrpl.wallet as wallet
import pandas as pd
import time

JSON_RPC_URL = "https://s2.ripple.com:51234/"
client = JsonRpcClient(JSON_RPC_URL)


sender_account = input('Sender address: ').strip()
seed = input('Sender seed: ').strip()
AMOUNT_TO_SEND = int(input('Amount to send: '))
sequence = xrpl.account.get_next_valid_seq_number(sender_account,client)
test_wallet = wallet.Wallet(seed=seed,sequence=sequence)

filename = 'send_XRP_toSUBS.xlsx'
df = pd.read_excel(filename)
df['Result'] = df['Result'].astype(str)

for index, row in df.iterrows():
    destination_address = row['Address']
    print('Sending to: ' + row['Address'])
    my_payment = xrpl.models.transactions.Payment(
        account=test_wallet.classic_address,
        amount=xrpl.utils.xrp_to_drops(AMOUNT_TO_SEND),
        destination=destination_address,
    )
    # print("Payment object:", my_payment)

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
            sleep(3)
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
            print("Result code:", metadata["TransactionResult"])
            df.at[index, 'Result'] = metadata["TransactionResult"]
        else:
            df.at[index,'Result'] = f'TransactionReult not found. Hash: {tx_id}'
        if metadata.get("delivered_amount"):
            print("XRP delivered:", xrpl.utils.drops_to_xrp(
                        metadata["delivered_amount"]))
    except Exception as e:
        print(f'FAILED to validate trxn for: {destination_address} : {e}')
        df.at[index, 'Result'] = e

    time.sleep(2)
    print()
