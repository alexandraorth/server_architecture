require 'httparty'
require 'json'

#note: problem was because I was not using ssl
auth = {:username => "admin@appfirst.com", :password => "586854651"}

url = "https://wwws.appfirst.com/api/topology"

response = HTTParty.get(url, 
  :basic_auth => auth,
  :headers => {'Content-Type' => 'application/json'})

json = JSON.parse(response.to_s().gsub('=>', ':'))

puts "THIS IS JSON"

$i = 0
$j = 0

data = Array.new

while json["Edge"][$i] != nil do
  if json["Edge"][$i]["toID"] == "production_streamer1"
    data[$j] = json["Edge"][$i]["fromID"]
    $j = $j + 1
  elsif json["Edge"][$i]["fromID"] == "production_streamer1"
    data [$j] = json["Edge"][$i]["toID"]
    $j = $j + 1
  end
  $i = $i + 1
end

puts data