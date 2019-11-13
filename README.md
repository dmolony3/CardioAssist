# CardioAssist

## About
An artificial intelligence sentence completion app. Built using huggingface transformers library. Press the tab key to trigger sentence completion. For working example please visit (COMING SOON!). 

## Attention
To see where words focus their attention highlight some words and then select plot attention. This produces a heat map showing where the attention is focused for each word.

## Fine-tuning
If you would like to finetune on your own dataset you need to provide a text file where each line is a training sample. Ideally each line will be 1024 tokens so that the model doesn't have to use padding. 

## Usage
App can be deployed using the Dockerfile. From the app directory run:
```
docker build . -t <NAMEOFYOURAPP>  
docker run -it --detach -p 8080:8080 <NAMEOFYOURAPP>
```