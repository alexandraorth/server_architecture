require 'mongoid'

class Timemodel
	include Mongoid::Document

	field :time, type: Integer

	has_many :nodes
	has_many :edges
end

