defmodule GraphQl.Schema.Incidents do
  use GraphQl.Schema.Base
  alias GraphQl.Resolvers.{Incidents, Repository, User}

  ecto_enum :incident_status,  Core.Schema.Incident.Status
  ecto_enum :media_type,       Core.Schema.File.MediaType
  ecto_enum :incident_action,  Core.Schema.IncidentHistory.Action
  ecto_enum :action_item_type, Core.Schema.Postmortem.ActionItem.Type

  input_object :incident_attributes do
    field :title,       :string
    field :severity,    :integer
    field :description, :string
    field :status,      :incident_status
    field :tags,        list_of(:tag_attributes)
  end

  input_object :incident_message_attributes do
    field :text, non_null(:string)
    field :file, :file_attributes
  end

  input_object :postmortem_attributes do
    field :content,      non_null(:string)
    field :action_items, list_of(:action_item_attributes)
  end

  input_object :action_item_attributes do
    field :type, non_null(:action_item_type)
    field :link, non_null(:string)
  end

  input_object :reaction_attributes do
    field :name, :string
  end

  input_object :file_attributes do
    field :blob, :upload_or_url
  end

  input_object :notification_preferences_attributes do
    field :message,         non_null(:boolean)
    field :incident_update, non_null(:boolean)
  end

  input_object :follower_attributes do
    field :preferences, :notification_preferences_attributes
  end

  object :incident do
    field :id,          non_null(:id)
    field :title,       non_null(:string)
    field :description, :string
    field :severity,    non_null(:integer)
    field :status,      non_null(:incident_status)

    field :repository, non_null(:repository), resolve: dataloader(Repository)
    field :creator,    non_null(:user), resolve: dataloader(User)
    field :owner,      :user, resolve: dataloader(User)
    field :tags,       list_of(:tag), resolve: dataloader(Repository)
    field :postmortem, :postmortem, resolve: dataloader(Incidents)

    field :notification_count, :integer do
      resolve fn incident, _, %{context: %{loader: loader, current_user: user}} ->
        manual_dataloader(
          loader, Incidents, {:one, Core.Schema.Incident}, unread_notifications: {user, incident})
      end
    end

    field :follower, :follower, resolve: fn
      %{id: incident_id}, _, %{context: %{current_user: user}} ->
        {:ok, Core.Services.Incidents.get_follower(user.id, incident_id)}
    end

    connection field :messages, node_type: :incident_message do
      resolve &Incidents.list_messages/2
    end

    connection field :files, node_type: :file do
      resolve &Incidents.list_files/2
    end

    connection field :history, node_type: :incident_history do
      resolve &Incidents.list_history/2
    end

    timestamps()
  end

  object :postmortem do
    field :id,           non_null(:id)
    field :content,      non_null(:string)
    field :action_items, list_of(:action_item)
    field :creator,      non_null(:user), resolve: dataloader(User)

    timestamps()
  end

  object :action_item do
    field :type, non_null(:action_item_type)
    field :link, non_null(:string)
  end

  object :incident_history do
    field :id,      non_null(:id)
    field :action,  non_null(:incident_action)
    field :changes, list_of(:incident_change)

    field :actor,    non_null(:user), resolve: dataloader(User)
    field :incident, non_null(:incident), resolve: dataloader(Incidents)

    timestamps()
  end

  object :incident_change do
    field :key,  non_null(:string)
    field :prev, :string
    field :next, :string
  end

  object :incident_message do
    field :id,   non_null(:id)
    field :text, non_null(:string)

    field :incident,  non_null(:incident), resolve: dataloader(Incidents)
    field :creator,   non_null(:user), resolve: dataloader(User)
    field :reactions, list_of(:reaction), resolve: dataloader(Incidents)
    field :file,      :file, resolve: dataloader(Incidents)

    timestamps()
  end

  object :file do
    field :id,           non_null(:id)
    field :media_type,   :media_type
    field :filename,     :string
    field :filesize,     :integer
    field :width,        :integer
    field :height,       :integer
    field :content_type, :string

    field :blob, non_null(:string), resolve: fn
      file, _, _ -> {:ok, Core.Storage.url({file.blob, file}, :original)}
    end

    field :message, non_null(:incident_message), resolve: dataloader(Incidents)

    timestamps()
  end

  object :reaction do
    field :name,    non_null(:string)
    field :creator, non_null(:user), resolve: dataloader(User)
    field :message, non_null(:incident_message), resolve: dataloader(Incidents)

    timestamps()
  end

  object :notification do
    field :id,       non_null(:id)
    field :type,     non_null(:notification_type)
    field :user,     non_null(:user), resolve: dataloader(User)
    field :actor,    non_null(:user), resolve: dataloader(User)
    field :incident, :incident, resolve: dataloader(Incidents)
    field :message,  :incident_message, resolve: dataloader(Incidents)

    timestamps()
  end

  object :follower do
    field :id,          non_null(:id)
    field :user,        non_null(:user), resolve: dataloader(User)
    field :incident,    :incident, resolve: dataloader(Incidents)
    field :preferences, :notification_preferences

    timestamps()
  end

  object :notification_preferences do
    field :message,         :boolean
    field :incident_update, :boolean
  end

  connection node_type: :incident
  connection node_type: :incident_message
  connection node_type: :incident_history
  connection node_type: :file
  connection node_type: :notification

  delta :incident
  delta :incident_message

  object :incident_queries do
    connection field :incidents, node_type: :incident do
      middleware GraphQl.Middleware.Authenticated
      arg :repository_id, :id
      arg :q, :string

      resolve &Incidents.list_incidents/2
    end

    field :incident, :incident do
      middleware GraphQl.Middleware.Authenticated
      arg :id, non_null(:id)

      resolve safe_resolver(&Incidents.authorize_incident/2)
    end

    connection field :notifications, node_type: :notification do
      middleware GraphQl.Middleware.Authenticated
      arg :incident_id, :id

      resolve &User.list_notifications/2
    end
  end

  object :incident_mutations do
    field :create_incident, :incident do
      middleware GraphQl.Middleware.Authenticated
      arg :repository_id, non_null(:id)
      arg :attributes,    non_null(:incident_attributes)

      resolve safe_resolver(&Incidents.create_incident/2)
    end

    field :update_incident, :incident do
      middleware GraphQl.Middleware.Authenticated
      arg :id, non_null(:id)
      arg :attributes,  non_null(:incident_attributes)

      resolve safe_resolver(&Incidents.update_incident/2)
    end

    field :accept_incident, :incident do
      middleware GraphQl.Middleware.Authenticated
      arg :id, non_null(:id)

      resolve safe_resolver(&Incidents.accept_incident/2)
    end

    field :complete_incident, :incident do
      middleware GraphQl.Middleware.Authenticated
      arg :id, non_null(:id)
      arg :postmortem, non_null(:postmortem_attributes)

      resolve safe_resolver(&Incidents.complete_incident/2)
    end

    field :follow_incident, :follower do
      middleware GraphQl.Middleware.Authenticated
      arg :id, non_null(:id)
      arg :attributes, non_null(:follower_attributes)

      resolve safe_resolver(&Incidents.follow_incident/2)
    end

    field :unfollow_incident, :follower do
      middleware GraphQl.Middleware.Authenticated
      arg :id, non_null(:id)

      resolve safe_resolver(&Incidents.unfollow_incident/2)
    end

    field :create_message, :incident_message do
      middleware GraphQl.Middleware.Authenticated
      arg :incident_id, non_null(:id)
      arg :attributes,  non_null(:incident_message_attributes)

      resolve safe_resolver(&Incidents.create_message/2)
    end

    field :update_message, :incident_message do
      middleware GraphQl.Middleware.Authenticated
      arg :id,         non_null(:id)
      arg :attributes, non_null(:incident_message_attributes)

      resolve safe_resolver(&Incidents.update_message/2)
    end

    field :delete_message, :incident_message do
      middleware GraphQl.Middleware.Authenticated
      arg :id, non_null(:id)

      resolve safe_resolver(&Incidents.delete_message/2)
    end

    field :create_reaction, :incident_message do
      middleware GraphQl.Middleware.Authenticated
      arg :message_id, non_null(:id)
      arg :name, non_null(:string)

      resolve safe_resolver(&Incidents.create_reaction/2)
    end

    field :delete_reaction, :incident_message do
      middleware GraphQl.Middleware.Authenticated
      arg :message_id, non_null(:id)
      arg :name, non_null(:string)

      resolve safe_resolver(&Incidents.delete_reaction/2)
    end
  end

  object :incident_subscriptions do
    field :incident_delta, :incident_delta do
      arg :repository_id, :id
      arg :incident_id,   :id

      config fn
        %{repository_id: id}, %{context: %{current_user: user}} ->
          with {:ok, _} <- Incidents.authorize_incidents(id, user),
            do: {:ok, topic: "incidents:repos:#{id}"}

        %{incident_id: id}, context ->
          with {:ok, _} <- Incidents.authorize_incident(%{id: id}, context),
            do: {:ok, topic: "incidents:#{id}"}

        _, %{context: %{current_user: user}} -> {:ok, topic: "incidents:mine:#{user.id}"}
      end
    end

    field :incident_message_delta, :incident_message_delta do
      arg :incident_id, :id

      config fn
        %{incident_id: id}, context ->
          with {:ok, _} <- Incidents.authorize_incident(%{id: id}, context),
            do: {:ok, topic: "incidents:msgs:#{id}"}

        _, %{context: %{current_user: user}} -> {:ok, topic: "incidents:msgs:mine:#{user.id}"}
      end
    end

    field :notification, :notification do
      config fn _, %{context: %{current_user: %{id: id}}} ->
        {:ok, topic: "notifs:#{id}"}
      end
    end
  end
end
