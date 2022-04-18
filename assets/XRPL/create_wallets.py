import xrpl
from xrpl.clients import JsonRpcClient
import xrpl.wallet as wallet
import pandas as pd
from openpyxl import Workbook, load_workbook

JSON_RPC_URL = "https://s2.ripple.com:51234/"
client = JsonRpcClient(JSON_RPC_URL)

column_names = ['address','seed']
new_wallets = []

wb = Workbook()
ws = wb.active
ws.append(column_names)

result = ''
for x in range(45):
    newWallet = wallet.Wallet.create()
    xaddress = wallet.Wallet.get_xaddress(newWallet)
    private_key = newWallet.private_key
    public_key = newWallet.public_key
    seed = newWallet.seed
    sequence = newWallet.sequence
    wallet_from_seed = xrpl.wallet.Wallet(seed, 0)
    address = wallet_from_seed.classic_address
    ws.append([address, seed])
    print([address, seed])
    result = result + '\n' + address + '\t' + seed

wb.save(filename='new_xrpwallets.xlsx')
#
# import smtplib
import easygui
# import os
#
# EMAIL_USER = os.environ.get('EMAIL_USER')
# EMAIL_PASS = os.environ.get('EMAIL_PASS')
# email_recipient = 'maryangeliqueacuna@yahoo.com'
#
# with smtplib.SMTP_SSL('smtp.gmail.com', 465) as smtp:
#     subject = 'New XRP Wallets Created'
#     body = result
#
#     msg = f'Subject: {subject}\n\n{body}'
#
#     smtp.login(EMAIL_USER, EMAIL_PASS)
#     smtp.sendmail(EMAIL_USER, email_recipient, msg)
#
easygui.msgbox("DONE", title="Alert", ok_button='OK')
