import psycopg2

conn = psycopg2.connect("postgresql://postgres:pass%40123@localhost:5432/exams")
conn.autocommit = True
cur = conn.cursor()

# Get existing enum values
cur.execute("SELECT enumlabel FROM pg_enum WHERE enumtypid = 'attempteventtype'::regtype;")
existing_values = [row[0] for row in cur.fetchall()]
print("Existing enum values:", existing_values)

missing_values = ["PROCTORING_STARTED", "proctoring_started", "CAMERA_DISABLED", "camera_disabled", "CAMERA_ERROR", "camera_error"]

for val in missing_values:
    if val not in existing_values:
        try:
            cur.execute(f"ALTER TYPE attempteventtype ADD VALUE '{val}';")
            print(f"Added {val} to attempteventtype")
        except Exception as e:
            print(f"Error adding {val}: {e}")

conn.close()
