
TYPE
	ClientInfoType : 	STRUCT 
		BrowseResolution : WSTRING[80];
		LanguageId : WSTRING[3];
		SlotId : SINT;
		IpAddress : WSTRING[15];
		IsValid : BOOL;
		UserId : WSTRING[80];
	END_STRUCT;
	
	TestEnum : 
	(
		One,
		Two
	);
	
	TestEnum2 : 
		(
		One2,
		Two2
	);
END_TYPE
