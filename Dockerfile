FROM python:3.7
#FROM python:3.7.2-alpine3.8

LABEL maintainer="davidmolony@hotmail.com"
LABEL Description="This image is used to start CardioAssist app"

COPY . /app
WORKDIR /app

RUN apt-get update && apt-get install -y wget \
&& rm -rf /var/lib/apt/lists/*
RUN pip install -r requirements.txt

#CMD python app.py
CMD exec gunicorn --bind 0.0.0.0:8080 --workers 1 -t 300 --threads 8 app:app