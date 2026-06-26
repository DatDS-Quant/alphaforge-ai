class MockAlphaAgent:
    """
    Placeholder for future AI research agent.
    Currently returns predefined, deterministic mock research responses.
    """

    def __init__(self, agent_name: str = "AlphaForge Mock Agent"):
        self.agent_name = agent_name

    def generate_alpha_idea(self, topic: str = "momentum") -> str:
        """
        Mock method returning a simple alpha expression string based on topic input.
        """
        if "reversal" in topic.lower():
            return "-zscore(close, 20)"
        elif "volume" in topic.lower():
            return "zscore(volume, 60) * rank(momentum(close, 20))"
        else:
            return "rank(momentum(close, 20))"

    def get_status(self) -> str:
        return f"{self.agent_name} is active (Offline/Mock Mode)."
