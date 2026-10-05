from django.db import models  # noqa: F401

# This app has no models of its own. Platform pool management and topup
# pack administration (Phase 26) operate on models defined in the
# `memberships` app (PlatformChannelPool, PlatformPoolTopup, TopupPack,
# TopupPurchase) - admin_panel only adds the admin-facing views,
# serializers and services on top of them.
