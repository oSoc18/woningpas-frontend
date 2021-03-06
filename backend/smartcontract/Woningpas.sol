pragma solidity ^0.4.23;

contract Woningpas {
	mapping(address => Owner) owners;
	struct Owner{
		address addr;
		string[] keysOfHouses;
		//between id of the house and the house
		mapping(string => House) houses;
	}
	struct House{
		string id;
		string streetName;
		uint zipCode;
		string city;
		string country;
		//Array or mapping ?
		//id of the doc and Document
		mapping(string => Document) documents;
		string[] keysOfDocs;
	}
	struct Document{
		string fileId;
		bool isVerified;
		string hash;
		string addedAt;
	}
	function addHouse(string _streetName, uint _zipCode, string _city, string _country, string _idHouse) public{
		House memory house = House(_idHouse, _streetName, _zipCode, _city, _country, new string[](0));
		owners[msg.sender].houses[_idHouse] = house;
		owners[msg.sender].keysOfHouses.push(_idHouse);
	}


	function addDocument(string _fileId, bool _isVerified, string _hash, string _idHouse, string _addedAt) public{
		Document memory docToAdd = Document(_fileId, _isVerified, _hash, _addedAt);
		owners[msg.sender].houses[_idHouse].documents[_fileId] = docToAdd;
		owners[msg.sender].houses[_idHouse].keysOfDocs.push(_fileId);
	}

	function isVerified(string _fileId, string _houseId) public view returns (bool){
		return owners[msg.sender].houses[_houseId].documents[_fileId].isVerified;
	}


	 function setVerification(address owner, string _fileId, string _houseId) public {
		owners[owner].houses[_houseId].documents[_fileId].isVerified = true;
	}


	function getHouse(uint _index) public view returns(string, uint, string, string, string){
		string memory houseId;
		for (uint i=0; i<_index; i++) {
 			houseId = owners[msg.sender].keysOfHouses[i];
		}

		House storage house = owners[msg.sender].houses[houseId];
		return (house.streetName, house.zipCode, house.city, house.country, house.id);
	}


	function getHouseNumber() public view returns(uint){
		return owners[msg.sender].keysOfHouses.length;
	}

	function getDocumentNumber(string _idHouse) public view returns(uint){
		return owners[msg.sender].houses[_idHouse].keysOfDocs.length;
	}
	function getDocument(string _idHouse, uint _index) public view returns(string, bool, string, string){
		string memory fileId;
		for (uint i=0; i<_index; i++) {
 			fileId = owners[msg.sender].houses[_idHouse].keysOfDocs[i];
		}

		Document storage doc = owners[msg.sender].houses[_idHouse].documents[fileId];
		return (doc.fileId, doc.isVerified, doc.hash, doc.addedAt);
	}
	function getHouseWithId(string _idHouse) view public returns(string, string, uint, string, string){
		House storage house = owners[msg.sender].houses[_idHouse];
		return (house.id, house.streetName, house.zipCode, house.city, house.country);
	}
	function getDocumentWithId(address owner, string _idDocument, string _idHouse) view public returns(string, bool, string, string){
		Document storage document = owners[owner].houses[_idHouse].documents[_idDocument];
		return (document.fileId, document.isVerified, document.hash, document.addedAt);
	}
	function transferOwnership(address from, address to, string _idHouse) public {
		House storage house = owners[from].houses[_idHouse];
		owners[to].houses[_idHouse] = house;
		owners[to].keysOfHouses.push(_idHouse);


        for(uint i = 0 ; i < house.keysOfDocs.length; i++){
             Document storage doc = house.documents[house.keysOfDocs[i]];
             owners[to].houses[_idHouse].documents[house.keysOfDocs[i]] = doc;
        }

		string memory idH;
		for(uint k = 0; k < owners[from].keysOfHouses.length; k++){
			idH = owners[from].keysOfHouses[k];

		    if(keccak256(abi.encodePacked(idH)) == keccak256(abi.encodePacked(_idHouse))){
		    	delete owners[from].keysOfHouses[k];
		    	for (uint j = k; j<owners[from].keysOfHouses.length-1; j++){
         		   owners[from].keysOfHouses[k] = owners[from].keysOfHouses[k+1];
        		}
		        owners[from].keysOfHouses.length--;
		        delete owners[from].houses[_idHouse];
		        return;
		    }
		}

	}
}
