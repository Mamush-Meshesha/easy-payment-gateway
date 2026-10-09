import os
import glob
import re

base_config = """
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
"""

models = set()
output = [base_config]

schema_files = glob.glob('services/*/prisma/schema.prisma')

for f in schema_files:
    with open(f, 'r') as file:
        content = file.read()
        
        # Remove generator and datasource blocks
        content = re.sub(r'generator\s+\w+\s*{[^}]*}', '', content, flags=re.MULTILINE|re.DOTALL)
        content = re.sub(r'datasource\s+\w+\s*{[^}]*}', '', content, flags=re.MULTILINE|re.DOTALL)
        
        output.append(content)

with open('global_schema.prisma', 'w') as f:
    f.write('\n'.join(output))

print("Created global_schema.prisma")
