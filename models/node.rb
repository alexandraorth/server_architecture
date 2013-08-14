require 'mongoid'

class Node
	include Mongoid::Document

	field :id, type: String
	field :hostname, type: String

	belongs_to :snapshot
end