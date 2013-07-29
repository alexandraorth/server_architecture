require 'sinatra/base'
require 'json'
require 'mongoid'
require 'httparty'
require_relative 'models/server'
require_relative 'models/timemodel'
require_relative 'models/edge'
require_relative 'models/node'

class App < Sinatra::Base
	configure do 
		set :public_folder, ENV['RACK_ENV'] == 'production' ? 'dist' : 'app'
		Mongoid.load!('mongoid.yml')
		enable :logging
	end

	get '/' do 
		File.read(File.join('views', 'index.html.erb'))
	end

	get '/timemodel' do
		File.read(File.join('views', 'timemodel.html.erb'))
	end

	before '/api*' do
		content_type :json
	end

	get '/api/appfirst' do

		$i = 0
		$j = 0

		auth = {:username => "admin@appfirst.com", :password => "586854651"}

		url = "https://wwws.appfirst.com/api/topology"

		response = HTTParty.get(url, 
			:basic_auth => auth,
			:headers => {'Content-Type' => 'application/json'})

		new_time = Timemodel.create 
		new_time.update_attributes(time: Time.new.to_i)

		json = JSON.parse(response.to_s().gsub('=>', ':'))

		# Add nodes to timemodels from API
		while json["Node"][$i] != nil do
			new_node = new_time.nodes.create
			new_node.update_attributes(id: json["Node"][$i]["id"],
				hostname: json["Node"][$i]["id"]
				)
			$i = $i + 1
		end

		# Add edges to timemodels from API
		while json["Edge"][$i] != nil do
			new_edge = new_time.edges.create
			new_edge.update_attributes(toID: json["Edge"][$i]["toID"],
				fromID: json["Edge"][$i]["fromID"],
				swrite: json["Edge"][$i]["swrite"],
				sread: json["Edge"][$i]["sread"],
				ttime1: json["Edge"][$i]["ttime1"],
				ttime2: json["Edge"][$i]["ttime2"]
			)
			$i = $i + 1 
		end
	end

	get '/api/timemodel' do
		Timemodel.all.to_json
	end

	get '/api/timemodel/:id' do
		Timemodel.find(params[:id]).to_json
	end

	get '/api/timemodel/:id/nodes' do
		 Timemodel.find(params[:id]).nodes.to_json
	end

	get '/api/timemodel/:id/node/:node_name' do

		data = Array.new

		data.push("[")
		# data[1] = Timemodel.find(params[:id]).nodes.find_by(hostname: params[:node_name]).to_json 
		# data.push(",")

		logger.info("this is the node name")
		logger.info(params[:node_name])

		# logger.info("right before the loop")
		Edge.each do |edge|
			# logger.info("from edge" + edge.fromID)
			# logger.info("to edge" + edge.toID)
			if edge.fromID == params[:node_name] or edge.toID == params[:node_name]
				data.push(edge.to_json )
				data.push(",")
			end
		end

		data[-1] = "]"

		data.join("")
		return data
	end

	post '/api/timemodel' do
		data = JSON.parse params[:timemodel]
		new_timemodel = Timemodel.create time: data['time']
		response['Location'] = '/server/#{new_timemodel.id}'
	end

	put '/api/timemodel' do
		data = JSON.parse params[:timemodel]
		Timemodel.find(data['_id']).update_attributes time: data['time']
	end

	delete '/api/server/:id' do
		Timemodel.find(params[:id]).delete
	end

	get '/api/server' do
		Server.all.to_json
	end

	get '/api/server/:id' do
		Server.find(params[:id]).to_json
	end

	post '/api/server' do
		data = JSON.parse params[:server]
		new_server = Server.create nickname: data['nickname']
		response['Location'] = "/server/#{new_server.id}"
		status 201
	end

	put '/api/server' do
		data = JSON.parse params[:server]
		Server.find(data['_id']).update_attributes nickname: data['name']
	end

	delete '/api/server/:id' do
		Server.find(params[:id]).delete
	end
end