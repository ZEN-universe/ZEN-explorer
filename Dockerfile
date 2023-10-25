FROM python:3.9.18-slim-bullseye

WORKDIR /work

COPY . .

RUN pip install -r requirements.txt
RUN pip install gunicorn

EXPOSE 8000

CMD ["gunicorn", "--bind", "0.0.0.0:8050", "app:server"]