ExUnit.start()
Ecto.Adapters.SQL.Sandbox.mode(Core.Repo, :manual)
Mimic.copy(Mojito)
Mimic.copy(HTTPoison)
Mimic.copy(Stripe.Connect.OAuth)
Mimic.copy(Stripe.Customer)
Mimic.copy(Stripe.Plan)
Mimic.copy(Stripe.Token)
Mimic.copy(Stripe.Subscription)
Mimic.copy(Stripe.SubscriptionItem)
Mimic.copy(Stripe.SubscriptionItem.Usage)
Mimic.copy(Stripe.Card)
Mimic.copy(Core.Conduit.Broker)

{:ok, _} = Application.ensure_all_started(:ex_machina)
