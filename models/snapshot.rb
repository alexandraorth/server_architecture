require 'mongoid'

class Snapshot
	include Mongoid::Document

	field :time, type: Integer

	has_many :nodes
	has_many :edges
end

