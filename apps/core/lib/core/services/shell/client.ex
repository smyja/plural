defmodule Core.Shell.Client do
  import Core.Services.Base, only: [ok: 1]
  alias Core.Schema.CloudShell
  alias Core.Services.Shell.Pods
  require Logger

  @headers [{"accept", "*/*"}, {"content-type", "application/json"}]

  def setup(%CloudShell{pod_name: name} = shell) do
    with {:ok, ip} <- Pods.ip(name),
         {:ok, req} <- request(shell) do
      case HTTPoison.post("http://#{ip}:8080/v1/setup", Poison.encode!(req), @headers) do
        {:ok, %HTTPoison.Response{status_code: 200}} -> {:ok, true}
        error ->
          Logger.error "Failed to setup shell: #{inspect(error)}"
          {:error, :failed}
      end
    end
  end

  def request(%CloudShell{user: user} = shell) do
    with {:ok, token} <- Core.Services.Users.access_token(user) do
      Piazza.Ecto.Schema.mapify(shell)
      |> Map.put(:user, %{name: user.name, email: user.email, access_token: token.token})
      |> ok()
    end
  end
end