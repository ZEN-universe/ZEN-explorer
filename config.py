import os
from dotenv import load_dotenv

load_dotenv()


class Config:
    def __init__(self) -> None:
        self.TEMPLE_URL: str = os.getenv("TEMPLE_URL")  # type: ignore
        self.BASE_URL: str = os.getenv("BASE_URL")  # type: ignore
        if self.BASE_URL is None:
            self.BASE_URL = "/"
        self.check()

    def check(self) -> None:
        for key, val in self.__dict__.items():
            if val is None:
                raise Exception(f"Env-Variable {key} is missing!")


config = Config()
