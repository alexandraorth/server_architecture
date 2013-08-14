require 'sinatra/base'
require 'json'
require 'mongoid'
require 'httparty'
require 'erb'
require_relative 'models/snapshot'
require_relative 'models/edge'
require_relative 'models/node'
require_relative 'models/application'
require_relative 'models/serverset'

class App < Sinatra::Base


	# =========================
	# Enter authentication information for your pod below
	# =========================

	USERNAME = 
	API_KEY = 


	get '/' do 
		erb :index
	end

	configure do 
		Mongoid.load!('mongoid.yml')
		enable :logging
	end

	before '/api*' do
		content_type :json
	end

	# =========================
	# API Calls to Appfirst for Parsing
	# =========================

	get '/api/appfirst' do

		$i = 0
		$j = 0

		auth = {:username => USERNAME, :password => API_KEY}

		url = "https://wwws.appfirst.com/api/topology"

		response = HTTParty.get(url, 
			:basic_auth => auth,
			:headers => {'Content-Type' => 'application/json'})

		json = JSON.parse(response.to_s().gsub('=>', ':'))

		url = "https://wwws.appfirst.com/api/servers"

		response = HTTParty.get(url, 
			:basic_auth => auth,
			:headers => {'Content-Type' => 'application/json'})

		serverJSON = JSON.parse(response.to_s().gsub('=>', ':'))		

		new_snapshot = Snapshot.create 
		new_snapshot.update_attributes(time: Time.new.to_i)

		# Add nodes to snapshots from API
		while json["Node"][$i] != nil do
			new_node = new_snapshot.nodes.create
			name = json["Node"][$i]["id"]
			id = ""

			$k = 0
			while serverJSON[$k]
				if serverJSON[$k]["nickname"] == name
					id = serverJSON[$k]["id"]
				end
				$k = $k +1
			end

			new_node.update_attributes(
				hostname: name,
				server_id: id
				)
			$i = $i + 1
		end

		# Add edges to snapshots from API
		while json["Edge"][$i] != nil do
			new_edge = new_snapshot.edges.create
			new_edge.update_attributes(
				toID: json["Edge"][$i]["toID"],
				fromID: json["Edge"][$i]["fromID"],
				swrite: json["Edge"][$i]["swrite"],
				sread: json["Edge"][$i]["sread"],
				tsnapshot1: json["Edge"][$i]["tsnapshot1"],
				tsnapshot2: json["Edge"][$i]["tsnapshot2"]
			)
			$i = $i + 1 
		end
	end

	get '/api/appfirstApplication' do

		$i = 0;

		auth = {:username => USERNAME, :password => API_KEY}

		url = "https://wwws.appfirst.com/api/applications"

		response = HTTParty.get(url, 
			:basic_auth => auth,
			:headers => {'Content-Type' => 'application/json'})

		json = JSON.parse(response.to_s().gsub('=>', ':'))

		while json[$i] != nil do
			new_app = Application.create

			new_app.update_attributes(
				name: json[$i]["name"],
				server_ids: json[$i]["servers"],
				app_id: json[$i]["id"]
				)

			$i = $i + 1
		end
		
		Application.all.to_json
	end


	get '/api/appfirstServerSets' do

		$i = 0;

		auth = {:username => USERNAME, :password => API_KEY}

		url = "https://wwws.appfirst.com/api/server_sets"

		response = HTTParty.get(url, 
			:basic_auth => auth,
			:headers => {'Content-Type' => 'application/json'})

		json = JSON.parse(response.to_s().gsub('=>', ':'))

		while json[$i] != nil do
			new_set = Serverset.create

			new_set.update_attributes(
				name: json[$i]["name"],
				server_ids: json[$i]["applications"]
				)
			$i = $i + 1
		end
		
		Serverset.all.to_json
	end

	# =========================
	# Custom API Calls
	# =========================

	get '/api/snapshot' do
	 Snapshot.all.to_json
	end

	get '/api/snapshot/:id' do
	 Snapshot.find(params[:id]).to_json
	end

	get '/api/snapshot/:id/nodes' do
		 Snapshot.find(params[:id]).nodes.to_json
	end

	get '/api/snapshot/:id/node/:node_name' do

		data = Array.new
		data.push("[")

		Edge.all_in(snapshot_id: [params[:id]]).each do |edge|
			if edge.fromID == params[:node_name] or edge.toID == params[:node_name]
				data.push(edge.to_json )
				data.push(",")
			end
		end

		data[-1] = "]"

		data.join("")
		return data
	end

	post '/api/snapshot' do
		data = JSON.parse params[:snapshot]
		new_snapshot = Snapshot.create snapshot: data['snapshot']
		response['Location'] = '/server/#{new_snapshot.id}'
	end

	put '/api/snapshot' do
		data = JSON.parse params[:snapshot]
	 Snapshot.find(data['_id']).update_attributes snapshot: data['snapshot']
	end

	delete '/api/server/:id' do
	 Snapshot.find(params[:id]).delete
	end

	get '/api/server' do
		Server.all.to_json
	end

	get '/api/application' do
		Application.all.to_json
	end

	get '/api/serverset' do
		Serverset.all.to_json
	end
end