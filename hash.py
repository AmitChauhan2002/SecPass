import hashlib
import sys

def hash_password(password):
    sha256 = hashlib.sha256()
    sha256.update(password.encode('utf-8'))
    return sha256.hexdigest()

if __name__ == '__main__':
    print(hash_password(sys.argv[1]))
