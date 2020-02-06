from flask import Flask, render_template, request, redirect, url_for, jsonify
from transformers import GPT2Config, GPT2Tokenizer, GPT2LMHeadModel
import torch
import random
import logging
import os

logging.basicConfig(format='%(message)s', level=logging.INFO)

app = Flask(__name__)
model_path = 'saved_model'
tokenizer = GPT2Tokenizer.from_pretrained(model_path)

def encode_text(text):
    indexed_tokens = tokenizer.encode(text)
    tokens_tensor = torch.tensor(indexed_tokens)
    return tokens_tensor
    
def decode_text(tokens_tensor):
    text = tokenizer.decode(tokens_tensor)
    return text

class Model():
    def __init__(self, model_path):
        config = GPT2Config.from_pretrained(model_path)
        config.output_hidden_states=True
        config.output_attentions = True
        self.model = GPT2LMHeadModel.from_pretrained(model_path, config=config)
        self.model.eval()
        self.context = ''
        
    def predict(self, tokens_tensor, past, temperature, top_k, idx=None):
        self.tokens_tensor = tokens_tensor
        with torch.no_grad():
            self.outputs = self.model(self.tokens_tensor.unsqueeze(0), past)
        logits = self.outputs[0]/temperature # higher temperature will spread out the probability i.e. generate more diverse output
        past = self.outputs[1]
        if len(logits.shape) == 3:
            predictions = torch.nn.functional.softmax(logits[0, -1, :], dim=-1)
        else:
            predictions = torch.nn.functional.softmax(logits[0, :], dim=-1)

        if top_k == 1:
            prediction_idx = torch.argmax(predictions).item()
        else:
            _, prediction_top_k_idx = torch.topk(predictions, top_k)
            if idx is None:
                predictions = predictions[prediction_top_k_idx]
                prediction_idx = prediction_top_k_idx[torch.multinomial(predictions, 1)].item()
            else:
                prediction_idx = prediction_top_k_idx[idx].item()

        text = decode_text(prediction_idx)
        return text, prediction_idx, past
        
    def get_attention(self, layer, head, tokens_tensor):
        batch_i = 0
        self.tokens_tensor = tokens_tensor
        with torch.no_grad():
            self.outputs = self.model(self.tokens_tensor.unsqueeze(0))
        attention = self.outputs[-1][layer][batch_i][head]

        return attention        
        
model = Model(model_path)

@app.route('/')
def index():
    heads = model.model.config.n_head
    layers = model.model.config.n_layer
    return render_template('index.html', newText="", numHeads=heads, numLayers=layers)


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
		tokens_tensor = encode_text(initial_context)
		for i in range(num_responses):
			print('Response {}'.format(i+1))
			past = None
			if num_responses > 1:
				next_word, prediction_idx, past = model.predict(tokens_tensor, past, temperature, num_responses, i)
			else:
				next_word, prediction_idx, past = model.predict(tokens_tensor, past, temperature, top_k, i)
				
			context = initial_context + next_word
			#print(context)
			generated_length = 1
			while next_word != '.' and next_word != tokenizer.eos_token and generated_length < 25:
				tokens_tensor = torch.tensor(prediction_idx)
				next_word, prediction_idx, past = model.predict(tokens_tensor, past, temperature, top_k)
				context = context + next_word
				#print(next_word)
				#print(context)
				generated_length += 1
			
			if next_word == tokenizer.eos_token:
				context = context.replace(tokenizer.eos_token, '')
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
        tokens_tensor = encode_text(text)
        attention = model.get_attention(layer, head, tokens_tensor)
        text_tokens = tokenizer.tokenize(text)
        text_tokens = [token.replace('Ġ', '') for token in text_tokens]
        print('Returning attention for layer {} head {}'.format(layer, head))
        attention = [{'text1': text_tokens[i], 'text2': text_tokens[j], 'attentionValue': attention[i][j].item()} for i in range(attention.shape[0]) for j in range(attention.shape[1])]
    return jsonify(attention)

if __name__ == '__main__':
    app.run(debug=False, host='0.0.0.0', port=int(os.environ.get('PORT', 8080)))