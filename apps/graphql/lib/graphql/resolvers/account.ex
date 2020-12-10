defmodule GraphQl.Resolvers.Account do
  use GraphQl.Resolvers.Base, model: Core.Schema.Account
  alias Core.Schema.{Group, GroupMember, Role}
  alias Core.Services.Accounts

  def query(Group, _), do: Group
  def query(Role, _), do: Role
  def query(GroupMember, _), do: GroupMember
  def query(_, _), do: Account

  def update_account(%{attributes: attrs}, %{context: %{current_user: user}}),
    do: Accounts.update_account(attrs, user)

  def list_groups(args, %{context: %{current_user: %{account_id: aid}}}) do
    Group.ordered()
    |> Group.for_account(aid)
    |> maybe_search(Group, args)
    |> paginate(args)
  end

  defp maybe_search(query, mod, %{q: search}) when is_binary(search), do: mod.search(query, search)
  defp maybe_search(query, _, _), do: query

  def list_group_members(%{group_id: group_id} = args, _) do
    GroupMember.for_group(group_id)
    |> paginate(args)
  end

  def list_roles(args, %{context: %{current_user: %{account_id: aid}}}) do
    Role.ordered()
    |> Role.for_account(aid)
    |> paginate(args)
  end

  def resolve_role(%{id: id}, _),
    do: {:ok, Accounts.get_role(id)}

  def resolve_invite(%{id: secure_id}, _),
    do: {:ok, Accounts.get_invite(secure_id)}

  def create_invite(%{attributes: attrs}, %{context: %{current_user: user}}),
    do: Accounts.create_invite(attrs, user)

  def create_group(%{attributes: attrs}, %{context: %{current_user: user}}),
    do: Accounts.create_group(attrs, user)

  def delete_group(%{group_id: group_id}, %{context: %{current_user: user}}),
    do: Accounts.delete_group(group_id, user)

  def update_group(%{attributes: attrs, group_id: group_id}, %{context: %{current_user: user}}),
    do: Accounts.update_group(attrs, group_id, user)

  def create_group_member(%{group_id: group_id, user_id: user_id}, %{context: %{current_user: user}}),
    do: Accounts.create_group_member(%{user_id: user_id}, group_id, user)

  def delete_group_member(%{group_id: group_id, user_id: user_id}, %{context: %{current_user: user}}),
    do: Accounts.delete_group_member(group_id, user_id, user)

  def create_role(%{attributes: attrs}, %{context: %{current_user: user}}) do
    with_permissions(attrs)
    |> Accounts.create_role(user)
  end

  def update_role(%{attributes: attrs, id: id}, %{context: %{current_user: user}}) do
    with_permissions(attrs)
    |> Accounts.update_role(id, user)
  end

  def delete_role(%{id: id}, %{context: %{current_user: user}}),
    do: Accounts.delete_role(id, user)

  defp with_permissions(%{permissions: perms} = attrs) when is_list(perms) do
    perm_set = MapSet.new(perms)
    permissions = Role.permissions() |> Enum.map(& {&1, MapSet.member?(perm_set, &1)}) |> Enum.into(%{})
    Map.put(attrs, :permissions, permissions)
  end
  defp with_permissions(attrs), do: attrs
end