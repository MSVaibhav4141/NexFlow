from .repository import UserRepository
from fastapi import Depends
from .services import UserService

def get_repository():
    return UserRepository()

def user_service(repo:UserRepository = Depends(get_repository)):
    return UserService(repo=repo)