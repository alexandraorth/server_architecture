require 'mongoid'

class Server
	include Mongoid::Document

	field :nickname, type: String

end

