# Mall Virtual Guayaquil Database

## USERS

id
email
password
role
created_at

## STORES

id
owner_id
name
slug
description
logo
whatsapp
address
city
is_verified
subscription_plan
created_at

## PRODUCTS

id
store_id
name
description
price
stock
sku
images
category_id
is_active

## CATEGORIES

id
name
icon

## CARTS

id
user_id
store_id

## CART_ITEMS

id
cart_id
product_id
quantity

## ORDERS

id
user_id
store_id
status
total
created_at

## STORE_ANALYTICS

id
store_id
profile_views
product_clicks
whatsapp_clicks