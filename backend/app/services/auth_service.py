import os
import logging
from google.oauth2 import id_token
from google.auth.transport import requests
from fastapi import HTTPException, status

logger = logging.getLogger(__name__)

def verify_google_token_service(credential: str):
    """
    Verifies the Google ID token and returns the email and name.
    Raises HTTPException if invalid.
    """
    try:
        # Verify the token using Google's libraries
        id_info = id_token.verify_oauth2_token(
            credential, 
            requests.Request(), 
            os.getenv("GOOGLE_CLIENT_ID")
        )
        
        user_email = id_info.get("email")
        user_name = id_info.get("name")

        if not user_email:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email not found in Google token.",
            )
            
        return user_email, user_name

    except ValueError:
        logger.warning("Invalid Google Token provided.")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, 
            detail="Invalid Google token."
        )
    except Exception as e:
        logger.error(f"Google Auth Error: {str(e)}", exc_info=True)
        # Re-raise HTTP exceptions, wrap others
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal authentication error."
        )