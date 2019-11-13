from flask import Flask, render_template, request, redirect, url_for, jsonify
from pytorch_transformers import GPT2Config, GPT2Tokenizer, GPT2LMHeadModel
import torch
import random
from waitress import serve

app = Flask(__name__)
"""
config = GPT2Config.from_pretrained('gpt2-medium')
config.output_hidden_states=True
config.output_attentions=True
tokenizer = GPT2Tokenizer.from_pretrained('gpt2-medium')
model = GPT2LMHeadModel.from_pretrained('gpt2-medium', config=config)
model.eval()
"""
tokenizer = GPT2Tokenizer.from_pretrained('gpt2-medium')

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

class Model():
	def __init__(self):
		config = GPT2Config.from_pretrained('gpt2-medium')
		config.output_hidden_states=True
		config.output_attentions=Truetokenizer = GPT2Tokenizer.from_pretrained('gpt2-medium')
		self.model = GPT2LMHeadModel.from_pretrained('gpt2-medium', config=config)
		self.model.eval()
		self.context = ''
		
	def predict(self, context, past, temperature, top_k, idx=None):
		self.context = context
		self.tokens_tensor = encode_text(self.context)
		with torch.no_grad():
			self.outputs = self.model(self.tokens_tensor, past)
			logits = self.outputs[0]/temperature # higher temperature will spread out the probability i.e. generate more diverse output
			past = self.outputs[1]
			predictions = torch.nn.functional.softmax(logits[0, -1, :], dim=-1)
			if top_k == 1:
				prediction_idx = torch.argmax(predictions).item()
			else:
				_, prediction_top_k_idx = torch.topk(predictions, top_k)
				if idx is None:
					predictions = predictions[prediction_top_k_idx]
					prediction_idx = prediction_top_k_idx[torch.multinomial(predictions, 1)].item()
				else:
					prediction_idx = prediction_top_k_idx[idx].item()
				#idx = random.randint(0, len(predictions)-1)
				#prediction_idx = predictions[idx].item()

		text = decode_text(prediction_idx)
		return text, past	
		
	def get_attention(self, layer, head, text):
		batch_i = 0
		"""
		text_tokens = tokenizer.tokenize(text)
		context_tokens = tokenizer.tokenize(self.context)
		token_idx = [i for i in range(len(context_tokens)) if context_tokens[i] in text_tokens]
		attention = self.outputs[-1][layer][batch_i][head][token_idx][:, token_idx]
		tokens = [context_tokens[idx] for idx in token_idx]
		"""
		self.tokens_tensor = encode_text(text)
		with torch.no_grad():
			self.outputs = self.model(self.tokens_tensor)
		attention = self.outputs[-1][layer][batch_i][head]
		tokens = tokenizer.tokenize(text)

		return attention, tokens		
		
model = Model()

def get_model():
	text = 'Default text'
	return text
	
@app.route('/')
def index():
	heads = model.model.config.n_head
	layers = model.model.config.n_layer
	return render_template('index.html', newText="", numHeads=heads, numLayers=layers)

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
	"""Returns responses from model based on initial_context
	Receives temperature, top_k, num_responses and initial_context from app.
	If num_responses > 1 then the top-k next wordsare used as inital seeds for the next world
	Returns json object for each response
	"""
	if request.method == 'POST':
		result = request.get_json()
		temperature = float(result['temperature'])
		top_k = int(result['top-k'])
		num_responses = int(result['num-responses'])
		initial_context = result['text'].strip()
		text = []
		for i in range(num_responses):
			print('Response {}'.format(i))
			past = None
			if num_responses > 1:
				next_word, past = model.predict(initial_context, past, temperature, num_responses, i)
			else:
				next_word, past = model.predict(initial_context, past, temperature, top_k, i)
				
			context = initial_context + next_word
			print(context)
			generated_length = 1
			while next_word != '.' and next_word != tokenizer.eos_token and generated_length < 25:
				next_word, past = model.predict(next_word, past, temperature, top_k)
				context = context + next_word
				print(next_word)
				print(context)
				generated_length += 1
			new_text = context.replace(initial_context, ' ')
			print(new_text)
			text.append({'text': new_text})
		# to send multiple strings to client wrap in list e.g. text= [{'text':'hello'},{'text':'how'}]
		return jsonify(text)
	else:
		print('did not work')
	return redirect('/')

@app.route('/plot_attention', methods=['GET', 'POST'])
def plot_attention():
	if request.method == 'POST':
		params = request.get_json()
		layer = int(params['layer'])
		head = int(params['head'])
		text = params['text']
		attention, text_tokens = model.get_attention(layer, head, text)
		text_tokens = [token.replace('Ġ', '') for token in text_tokens]
		print('Returning attention for layer {} head {}'.format(layer, head))
		attention = [{'text1': text_tokens[i], 'text2': text_tokens[j], 'attentionValue': attention[i][j].item()} for i in range(attention.shape[0]) for j in range(attention.shape[1])]
	return jsonify(attention)

if __name__ == 'main':
	#load_model()
	app.run()
	#serve(app, host='0.0.0.0', port=8000)