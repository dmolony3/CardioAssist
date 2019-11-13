FROM python:3.7
#FROM python:3.7.2-alpine3.8

LABEL maintainer="davidmolony@hotmail.com"
LABEL Description="This image is used to start CardioAssist app"

COPY . /app
WORKDIR /app

RUN apt-get update && apt-get install -y wget \
&& rm -rf /var/lib/apt/lists/*
#RUN pip install torch==1.2.0+cpu torchvision==0.4.0+cpu -f https://download.pytorch.org/whl/torch_stable.html
RUN pip install -r requirements.txt
RUN git clone https://github.com/dmolony3/transformers.git && cd transformers && python setup.py install && cd ..

#https://medium.com/@paudelanjanchandra/download-google-drive-files-using-wget-3c2c025a8b99
RUN wget --load-cookies /tmp/cookies.txt "https://docs.google.com/uc?export=download&confirm=$(wget --quiet --save-cookies /tmp/cookies.txt --keep-session-cookies --no-check-certificate 'https://docs.google.com/uc?export=download&id=10x-RbNBkhz7PMUcrGpd_DlihtQ85lDHA' -O- | sed -rn 's/.*confirm=([0-9A-Za-z_]+).*/\1\n/p')&id=10x-RbNBkhz7PMUcrGpd_DlihtQ85lDHA" -O model.tar && rm -rf /tmp/cookies.txt && \
mkdir saved_model && \
tar xf model.tar -C saved_model && \
rm model.tar

CMD python app.py
#CMD exec gunicorn --bind $PORT --workers 1 --theads 8 app:app