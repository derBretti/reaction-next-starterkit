import React from "react";
import PropTypes from "prop-types";
import { Query } from "react-apollo";
import { inject } from "mobx-react";
import hoistNonReactStatic from "hoist-non-react-statics";
import withShop from "containers/shop/withShop";
import catalogItemProductQuery from "./catalogItemProduct.gql";

/**
 * withCatalogItemProduct higher order query component for fetching primaryShopId and catalog data
 * @name withCatalogItemProduct
 * @param {React.Component} Component to decorate and apply
 * @returns {React.Component} - component decorated with primaryShopId and catalog as props
 */
export default function withCatalogItemProduct(Component) {
  @withShop
  @inject("cartStore", "authStore")
  class WithCatalogItemProduct extends React.Component {
    static propTypes = {
      router: PropTypes.object.isRequired,
      authStore: PropTypes.shape({
        accountId: PropTypes.string,
        isAuthenticated: PropTypes.bool
      }),
      cartStore: PropTypes.shape({
        anonymousCartId: PropTypes.string,
        anonymousCartToken: PropTypes.string,
        setAnonymousCartCredentialsFromLocalStorage: PropTypes.func
      }),
      shop: PropTypes.shape({
        _id: PropTypes.string
      })
    }

    render() {
      const { router: { query }, authStore, cartStore, shop } = this.props;

      let variables = { slugOrId: query.slugOrId };

      if (cartStore.hasAnonymousCartCredentials) {
        // Otherwise, set query and variables for fetching an anonymous cart
        Object.assign(variables, {
          cartId: cartStore.anonymousCartId,
          token: cartStore.anonymousCartToken
        });
      } else if (authStore.isAuthenticated) {
        // With an authenticated user, update the cart query to find an authenticated cart
        Object.assign(variables, {
          accountId: authStore.accountId,
          shopId: shop._id
        });
      }

      return (
        <Query errorPolicy="all" query={catalogItemProductQuery} variables={variables}>
          {({ data, loading }) => {
            const { catalogItemProduct } = data || {};
            const { product } = catalogItemProduct || {};

            return (
              <Component {...this.props} isLoadingProduct={loading} product={product} />
            );
          }}
        </Query>
      );
    }
  }

  hoistNonReactStatic(WithCatalogItemProduct, Component);

  return WithCatalogItemProduct;
}
