from fastapi import Header, HTTPException

from app.config import settings
import jwt

def validate_token(authorization:str =  Header(None)):
    try:
        print(authorization)
        auth = authorization.strip().split(" ")[1]
        print(auth)

        decoded = jwt.decode(jwt=auth, key=settings.JWT_SECRET,algorithms=["HS256"],verify=True) #type: ignore
        return decoded['sub']
    except Exception as e:
        print(f"Token validation failed: {e}")
        raise HTTPException(status_code=401, detail="Unauthorized")
    