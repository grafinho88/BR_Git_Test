
FUNCTION_BLOCK FB_Motor
	VAR_INPUT
		Enable : BOOL;
		Cmd : Type_MotorCommand;
		Parameter : Type_MotorParameter;
	END_VAR
	VAR_OUTPUT
		Status : USINT;
	END_VAR
	VAR_IN_OUT
		ErrorCounter : USINT;
	END_VAR
	VAR
		step : USINT;
	END_VAR
END_FUNCTION_BLOCK
