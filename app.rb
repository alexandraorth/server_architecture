require 'sinatra/base'
require 'json'
require 'mongoid'
require 'httparty'
require_relative 'server'

class App < Sinatra::Base
	configure do 
		set :public_folder, ENV['RACK_ENV'] == 'production' ? 'dist' : 'app'
		Mongoid.load!('mongoid.yml')
		enable :logging
	end

	get '/' do 
		logger.info "hello, whale"
		send_file File.join(settings.public_folder, 'index.html')
	end

	before '/server*' do
		content_type :json
	end

	get '/call' do

		# logger.debug("this is whale")

		auth = {:username => "admin@appfirst.com", :password => "586854651"}

		response = HTTParty.get(url, 
			:basic_auth => auth,
			:headers => {'Content-Type' => 'application/json'})
	end

	get '/server' do 
		Server.all.to_json
	end

	get '/server/:id' do
		Poi.find(params[:id]).to_json
	end

	post '/server' do
		data = JSON.parse params[:server]
		new_server = Server.create nickname: data['nickname']
		response['Location'] = "/server/#{new_server.id}"
		status 201
	end

	put '/server' do
		data = JSON.parse params[:server]
		Server.find(data['_id']).update_attributes nickname: data['name']
	end

	delete '/server/:id' do
		Server.find(params[:id]).delete
	end
end