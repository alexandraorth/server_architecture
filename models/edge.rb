require 'mongoid'

class Edge
	include Mongoid::Document

	field :toID, type: String
	field :fromID, type: String
	field :swrite, type: String
	field :sread, type: String
	field :ttime1, type: String
	field :ttime2, type: String

	belongs_to :timemodel
end
