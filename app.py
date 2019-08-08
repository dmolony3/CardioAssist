from flask import Flask, render_template, request, redirect, url_for, jsonify
from pytorch_transformers import GPT2Config, GPT2Tokenizer, GPT2LMHeadModel
import torch


app = Flask(__name__)
tokenizer = GPT2Tokenizer.from_pretrained('gpt2')
model = GPT2LMHeadModel.from_pretrained('gpt2')
model.eval()

# load model only once
def load_model():
	tokenizer = GPT2Tokenizer.from_pretrained('gpt2')
	text = 'Sample text'
	tokens_tensor = encode_text(text)
	model = GPT2LMHeadModel.from_pretrained('gpt2')
	model.eval()
	
def encode_text(text):
	indexed_tokens = tokenizer.encode(text)
	tokens_tensor = torch.tensor([indexed_tokens])
	return tokens_tensor
	
def decode_text(tokens_tensor):
	text = tokenizer.decode(tokens_tensor)
	return text

def predict(text):
	tokens_tensor = encode_text(text)
	with torch.no_grad():
		outputs = model(tokens_tensor)
		predictions = outputs[0]
		predictions = torch.argmax(predictions[0, -1, :]).item()
	text = decode_text(predictions)
	return text
	
def get_model():
	text = 'Default text'
	return text
	
@app.route('/')
def index():
	return render_template('index.html', newText="")

def display(text):
   return render_template('index.html', newText = text)
   
@app.route('/process', methods=['POST', 'GET'])
def process():
	if request.method == 'POST':
		result = request.form['textBox']
		text = get_model()
		print(result + text)
		return display(result+text)
	else:
		print('did not work')
	return redirect('/')

@app.route('/process1', methods=['POST', 'GET'])
def process1():
	if request.method == 'POST':
		result = request.get_json()
		#result = request.args.get('text')
		#text = get_model()
		text = predict(result['text'])
		print(result['text'])
		print(text)
		text = {'text': result['text'] + text}
		# to send multiple strings to client wrap in list e.g. text= [{'text':'hello'},{'text':'how'}]
		return jsonify(text)
	else:
		print('did not work')
	return redirect('/')

	
if __name__ == 'main':
	load_model()
	app.run()