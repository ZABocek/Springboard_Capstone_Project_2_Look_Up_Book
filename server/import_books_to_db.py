import pandas as pd
import psycopg2
from sqlalchemy import create_engine

# Load the Excel file
df = pd.read_excel('path_to_excel_file')

# Filter and map the data
filtered_books = df[df['title_of_winning_book'].notna() & (df['role'] == 'winner')][['full_name', 'title_of_winning_book', 'prize_name']]

# PostgreSQL connection parameters
db_user = 'your_username'
db_password = 'your_password'
db_host = 'localhost'
db_port = '5432'
db_name = 'your_database'
db_table = 'book_details'

# Create a database engine
engine = create_engine(f'postgresql+psycopg2://{db_user}:{db_password}@{db_host}:{db_port}/{db_name}')

# Insert the data into PostgreSQL
filtered_books.to_sql(db_table, engine, if_exists='append', index=False)
