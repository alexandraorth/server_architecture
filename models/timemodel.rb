require 'mongoid'

class Timemodel
	include Mongoid::Document

	field :time, type: String

	has_many :nodes
	has_many :edges
end

