from pydantic import BaseModel, ConfigDict, Field


class PlatformStatsResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    events: int = Field(0, description="Total published or active events")
    participants: int = Field(0, description="Total registered student participants")
    teams: int = Field(0, description="Total registered teams")
    winning_projects: int = Field(0, description="Total winning projects across events")
