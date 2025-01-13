import os
from supabase import create_client, Client
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

SUPABASE_URL = os.getenv('SUPABASE_URL')
SUPABASE_KEY = os.getenv('SUPABASE_KEY')

# Create a Supabase client
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

'''
# Example function to fetch data from a table
def fetch_data(table_name: str):
    response = supabase.table(table_name).select("*").execute()
    return response.data

# Example usage
if __name__ == "__main__":
    data = fetch_data("your_table_name")
    print(data)

    '''