import uuid
import random
from datetime import datetime, timedelta

sql = """
SET FOREIGN_KEY_CHECKS = 0;
TRUNCATE TABLE parking_record;
TRUNCATE TABLE parking_record_history;
TRUNCATE TABLE payment;
SET FOREIGN_KEY_CHECKS = 1;

SET @staff1 = '3cc39d83-60be-11f1-9aa4-bafb061cf531';
SET @staff2 = '3cc3a1b1-60be-11f1-9aa4-bafb061cf531';

INSERT IGNORE INTO account (account_id, password, role, username) VALUES 
(@staff1, '$2a$10$riOsq0JyAqDzFCXShMPvxeqILBKQnYdZik/ZYpeeEEodkyCMkf6Pq', 'STAFF', 'bot_staff1'),
(@staff2, '$2a$10$riOsq0JyAqDzFCXShMPvxeqILBKQnYdZik/ZYpeeEEodkyCMkf6Pq', 'STAFF', 'bot_staff2');

INSERT IGNORE INTO staff (account_id, address, dob, email, gender, identification, is_active, name, phone_number) VALUES
(@staff1, 'Hà Nội', '1995-01-01', 'bot1@test.com', 'MALE', 'BOT109500001', 1, 'Nguyễn Bot 1', '0900000001'),
(@staff2, 'HCM', '1998-05-05', 'bot2@test.com', 'FEMALE', 'BOT109800002', 1, 'Trần Bot 2', '0900000002');

SET @bike_id = (SELECT id FROM vehicle_type WHERE name = 'Bicycle');
SET @moto_id = (SELECT id FROM vehicle_type WHERE name = 'Motorbike');
SET @scooter_id = (SELECT id FROM vehicle_type WHERE name = 'Scooter');
"""

vehicle_types = ['Bicycle', 'Motorbike', 'Scooter']
vehicle_type_ids = {
    'Bicycle': '@bike_id',
    'Motorbike': '@moto_id',
    'Scooter': '@scooter_id'
}

used_cards = set(range(1, 10)) 
def get_card():
    card = random.randint(15, 9999)
    while card in used_cards:
        card = random.randint(15, 9999)
    used_cards.add(card)
    return card

# 150 xe dang trong bai
for i in range(150):
    record_id = str(uuid.uuid4())
    entry_time = datetime.utcnow() - timedelta(minutes=random.randint(5, 600))
    v_type = random.choice(vehicle_types)
    lp = f"{random.randint(11, 99)}{random.choice(['A','B','C','D','E','F'])}{random.randint(1,9)}-{random.randint(10000, 99999)}"
    if v_type == 'Bicycle': lp = f"BIKE-{random.randint(100, 999)}"
    card_id = get_card()
    staff = random.choice(['@staff1', '@staff2'])
    sql += f"INSERT INTO parking_card (card_id) VALUES ('{card_id}') ON DUPLICATE KEY UPDATE card_id=card_id;\n"
    sql += f"INSERT INTO parking_record (record_id, entry_time, identifier, license_plate, type, card_id, staff_in, vehicle_type) VALUES ('{record_id}', '{entry_time.strftime('%Y-%m-%d %H:%M:%S')}', '{lp}', '{lp}', 'DAILY', '{card_id}', {staff}, {vehicle_type_ids[v_type]});\n"

# 300 xe da ra (de xem thong ke)
for i in range(300):
    payment_id = str(uuid.uuid4())
    history_id = str(uuid.uuid4())
    entry_time = datetime.utcnow() - timedelta(days=random.randint(0, 30), minutes=random.randint(30, 600))
    exit_time = entry_time + timedelta(minutes=random.randint(15, 400))
    v_type = random.choice(vehicle_types)
    amount = 2000 if v_type == 'Bicycle' else (4000 if v_type == 'Motorbike' else 5000)
    lp = f"{random.randint(11, 99)}{random.choice(['A','B','C','D','E','F'])}{random.randint(1,9)}-{random.randint(10000, 99999)}"
    if v_type == 'Bicycle': lp = f"BIKE-{random.randint(100, 999)}"
    card_id = get_card()
    staff_in = random.choice(['@staff1', '@staff2'])
    staff_out = random.choice(['@staff1', '@staff2'])
    
    sql += f"INSERT INTO parking_card (card_id) VALUES ('{card_id}') ON DUPLICATE KEY UPDATE card_id=card_id;\n"
    sql += f"INSERT INTO payment (payment_id, amount, create_at, payment_type) VALUES ('{payment_id}', {amount}, '{exit_time.strftime('%Y-%m-%d %H:%M:%S')}', 'PARKING');\n"
    sql += f"INSERT INTO parking_record_history (history_id, entry_time, exit_time, identifier, license_plate, type, card_id, payment_id, staff_in, staff_out, vehicle_type) VALUES ('{history_id}', '{entry_time.strftime('%Y-%m-%d %H:%M:%S')}', '{exit_time.strftime('%Y-%m-%d %H:%M:%S')}', '{lp}', '{lp}', 'DAILY', '{card_id}', '{payment_id}', {staff_in}, {staff_out}, {vehicle_type_ids[v_type]});\n"

with open('many_data.sql', 'w', encoding='utf-8') as f:
    f.write(sql)

