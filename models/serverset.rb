require 'mongoid'

class Serverset
	include Mongoid::Document

	field :name, type: String
	field :server_ids, type: Array
end
