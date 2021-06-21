import { Component, OnInit, ViewChild } from '@angular/core';
import { Product } from 'app/core/models/Product';
import { ProductService } from '../../product.service';
import { LocalStorageService } from 'app/core/services/local-storage.service';
import { faPlusCircle } from '@fortawesome/free-solid-svg-icons';
import { CartService } from '../../cart.service';
import { Cart, CartItem } from 'app/core/models/Cart';
import { AuthService } from 'app/core/services/auth.service';
import { SaveCartRequest } from 'app/core/models/requests/SaveCartRequest';
import { NotificationService } from 'app/core/services/notification.service';
import { CartDetailsComponent } from '../cart-details/cart-details.component';
import { OrderService } from '../../order.service';
import { PlaceOrderRequest } from 'app/core/models/requests/PlaceOrderRequest';
import { Router } from '@angular/router';
import { CurrencyNotificationService } from 'app/core/services/currency-notification.service';
import { appConstants } from 'app/core/constants/appConstants';

@Component({
  selector: 'app-products',
  templateUrl: './product-selection.component.html',
  styleUrls: ['./product-selection.component.scss'],
})
export class ProductSelectionComponent implements OnInit {

  @ViewChild('cart') cartDetails: CartDetailsComponent;
  currentCurrency:string;

  cartId: string;
  storedCurrency: string;
  customerId: string;
  products: Product[];
  refreshCart: boolean;
  faPlusCircle = faPlusCircle;

  constructor(
    private authService: AuthService,
    private notificationService: NotificationService,
    private productService: ProductService,
    private localStorageService: LocalStorageService,
    private currencyNotificationService: CurrencyNotificationService,
    private cartService: CartService,
    private orderService: OrderService,
    private router: Router
  ) {}

  ngOnInit() {

    this.storedCurrency = this.localStorageService.getValueByKey(appConstants.storedCurrency);
    this.cartId = this.localStorageService.getValueByKey(appConstants.storedCart);
    var customer = this.authService.currentCustomerValue;

    if(customer) {
      this.customerId = customer.id;
      this.loadProducts();
    }

    // Currency change listener
    this.currencyNotificationService.currentCurrency
      .subscribe(currencyCode => {
        if(currencyCode != '') {
          this.storedCurrency = currencyCode;
          this.loadProducts();
        }
      }
    );
  }

  loadProducts() {
    this.productService
      .getProducts(this.storedCurrency)
      .subscribe(
        (result: any) => {
          this.products = result.data;
          this.products.forEach((product) => { product.quantity = 0 });
        },
        (error) => console.error(error)
      );
  }

  syncronizeCartToProductList(cart: Cart){
    if(this.products){
      if(cart.cartItems.length == 0)
        this.products.forEach((product) => { product.quantity = 0 });

      this.products.forEach((product) => {
        var productFound = cart.cartItems.filter(
          (cartItem: CartItem) => cartItem.productId == product.id
        );

        if(productFound.length > 0)
          product.quantity = productFound[0].productQuantity;
        else
          product.quantity  = 0;
      });
    }
  }

  saveCart(product: Product){

    if(product.quantity == 0)
      product.quantity = 1;
    else
      product.quantity = Number(product.quantity);

    let request = new SaveCartRequest(this.customerId, product, this.storedCurrency);
    this.cartService.saveCart(request)
      .subscribe(
        (result: any) => {
          this.cartId = result.data;
          this.localStorageService.setValue(appConstants.storedCart, this.cartId);
          this.cartDetails.getCartDetails();
          this.notificationService.showSuccess('Cart changed with success.');
        },
        (error) => console.error(error)
      );
  }

  placeOrder() {
    let request = new PlaceOrderRequest(this.customerId, this.storedCurrency);
    this.orderService.placeOrder(this.cartId, request)
      .subscribe((result: any) => {
          this.localStorageService.clearKey('cartItems');
          this.notificationService.showSuccess('Order placed with success.');
          this.router.navigate(['/orders/' + this.customerId + '/' + result.data]);
        },
        (error) => console.error(error)
      );
  }
}
